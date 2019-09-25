package com.zarafa.jsconcat;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Concatinator
{

	private final static Pattern classPattern = Pattern.compile("\\W+@class\\s+(.+)");
	private final static Pattern extendsPattern = Pattern.compile("\\W+@extends\\s+(.+)");
	private final static Pattern dependsPattern = Pattern.compile("\\W+#dependsFile\\s+(.+)");
	
	private HashMap<String, FileNode> classDefs;	
	private HashMap<String, String> classExtends;
	private ArrayList<FileNode> fileNodes;

	/**
	 * Represents a single JavaScript input file and its dependencies. 
	 */
	private class FileNode 
	{
		public File file;
		public int depth, priority;
		public Vector<String> classNames;
		public Vector<String> dependencyNames;
		public Vector<FileNode> dependNodes;
		
		/**
		 * Constructs a new file node.
		 * @param file file
		 */
		public FileNode(File file)
		{
			this.file = file;

			classNames = new Vector<String>();
			dependencyNames = new Vector<String>();
			dependNodes = new Vector<FileNode>();
		}
		
		/**
		 * Performs some analysis on the contents of the file, checking for defined classes and explicit
		 * dependency declarations.
		 * 
		 * @throws FileNotFoundException
		 * @throws IOException
		 */
		public void analyse() throws FileNotFoundException, IOException
		{
			BufferedReader reader = new BufferedReader(new FileReader(file));
			
			String className = null;
			Matcher matcher;
			String line;
			while ((line=reader.readLine())!=null)
			{
				// Check if the line contains a @class declaration
				if ((matcher = classPattern.matcher(line)).matches())
				{
					className = matcher.group(1);
					classDefs.put(className, this);
					classNames.add(className);
				} 
				
				// Check if the line contains an @extends declaration
				if ((matcher = extendsPattern.matcher(line)).matches())
					if (className!=null)
						classExtends.put(className, matcher.group(1));

				// Check if the line contains a @class declaration
				if ((matcher = dependsPattern.matcher(line)).matches())
					dependencyNames.add(matcher.group(1).replace('/', File.separatorChar));

			}
			reader.close();
		}
		
		/**
		 * Checks if any of the classes defined in this file matches the given expression
		 * 
		 * @param expression a regular expression to match class names against (i.e. 'Foo.bar.*').   
		 * @return expression true iff a class defined in this file matches the given expression.
		 */
		public boolean matchClassNames(String expression)
		{
			for (String className : classNames)
				if (className.matches(expression))
					return true;
			
			return false;
		}
		
		/**
		 * Adds a dependency between this file and another. 
		 * 
		 * @param node a file this file depends on.
		 */
		public void addDependency(FileNode node)
		{
			if (this!=node)
				this.dependNodes.add(node);
		}
		
		/** 
		 * @return String representation of this file node. 
		 */
		public String toString()
		{
			return file.getName();
		}
		
	}

	/**
	 * Constructs a new Concatenator instance.
	 */
	public Concatinator()
	{
		fileNodes = new ArrayList<FileNode>();

		classDefs = new HashMap<String, FileNode>();
		classExtends = new HashMap<String, String>();
	}
	
	/**
	 * Adds a file to the concatenator.
	 * @param fileName name of the JavaScript file
	 * @throws FileNotFoundException
	 * @throws IOException
	 */
	public void addFile(String fileName) throws FileNotFoundException, IOException 
	{
		File file = new File(fileName);
		
		// Check if the file exists. 
		if (!file.exists())
			throw new FileNotFoundException(file.toString());
		
		// Construct a FileNode with this file.
		FileNode node = new FileNode(file);
		
		// Do analysis of the file, this extracts the dependencies.
		node.analyse();
		
		// Add the new file node to the list.
		fileNodes.add(node);		
	}
	
	/**
	 * Sorts the files based first on dependency depth and priority second. Formatted as a comma-separated list of 
	 * regular expressions, the <pre>prioritise</pre> argument can be used to move groups of files up the list.
	 * Files that have classes defined in them have those full class names matched against the regexps.  
	 * Files that match the first priority group have the highest priority, files that match the second group come
	 * after that, and so on.
	 * <p>
	 * For example, calling sort with "\w+, Foo.bar.*" will move all files which have classes in the 'root' package
	 * (i.e. 'Date', 'Foo') to the top of the list, after wich come all files which have classes in 'Foo.bar' or any
	 * of its descending packages, and finally all the files that match neither of these criteria.
	 * <p>
	 * The regular expression format is the standard <a href="http://java.sun.com/javase/6/docs/api/java/util/regex/Pattern.html">Java format<a>.
	 * 
	 * @param prioritise a comma-separated list of regexps to match packages.
	 */
	public void sort(String prioritise)
	{
		// Pre condition.
		if (prioritise==null)
			throw new NullPointerException();
		
		// Calculate inter-node dependencies.
		for (FileNode fileNode : fileNodes)
		{
			for (String className : fileNode.classNames)
			{
				String parentClass = classExtends.get(className);
				if (classDefs.containsKey(parentClass))
					fileNode.addDependency(classDefs.get(parentClass));
			}

			for (String dependencyName : fileNode.dependencyNames)
				for (FileNode depNode : fileNodes)
					if (depNode.file.getAbsolutePath().endsWith(dependencyName))
						fileNode.addDependency(depNode);
		}

		// Initialise the depth of each node to 0 for root nodes and -1 for all others.
		for (FileNode fileNode : fileNodes)
			fileNode.depth = fileNode.dependNodes.size()==0 ? 0 : -1;

		// Calculate depth.
		boolean changed = true;
		while (changed)
		{
			
			changed = false;
			
			for (FileNode fileNode : fileNodes)
			{
				int max=-1; boolean complete=true;
				
				for (FileNode dependency : fileNode.dependNodes)
				{
					complete = complete && dependency.depth != -1;
					max = Math.max(max, dependency.depth);
				}

				if (complete && fileNode.depth!=max+1)
				{
					fileNode.depth = max + 1;
					changed = true;
				}
			}
			
		}

		// Match class names to priorities
		String[] priorityPackages = prioritise.trim().split(",\\s*");
		
		for (FileNode fileNode : fileNodes)
		{
			fileNode.priority = priorityPackages.length;
			for (int i=0; i<priorityPackages.length; i++)
				if (fileNode.matchClassNames(priorityPackages[i]))
				{
					fileNode.priority = i;
					break;					
				}
		}
		
		
		// Sort array list based on depth.
		Collections.sort(fileNodes, new Comparator<FileNode>() {
			@Override
			public int compare(FileNode node1, FileNode node2)
			{
				if (node1.depth == node2.depth) {
					if (node1.priority < node2.priority) {
						return -1;
					}
					if (node1.priority == node2.priority) {
						return 0;
					}

					return 1;
				}

				if (node1.depth < node2.depth) {
					return -1;
				}
				if (node1.depth > node2.depth) {
					return 1;
				}
				return 0;
			}
		});
		
	}
	
	/**
	 * Shows a list of files, their depth, priority, and any detected dependencies on other files.
	 */
	public void printStatus()
	{
		System.out.printf("%-40s %-6s %-8s %s\n", "File", "Depth", "Priority", "Dependencies");
		System.out.println("----------------------------------------------------------------------");
		for (FileNode fileNode : fileNodes)
		{
			String deps = fileNode.dependNodes.toString();
			System.out.printf("%-40s %-6d %-8d %s%n",
					fileNode,
					fileNode.depth,
					fileNode.priority,
					deps.substring(1, deps.length()-1));
		}
	}
	
	/**
	 * Concatenates the files and writes the output to a outputFileName.
	 * 
	 * @param outputFileName name of the output file. 
	 * 
	 * @throws FileNotFoundException
	 * @throws IOException
	 */
	public void concat(String outputFileName) throws FileNotFoundException, IOException
	{
		// Calculate dependencies
		FileOutputStream outStream = new FileOutputStream(outputFileName);

		// Create a list of input streams
		ArrayList<InputStream> inputStreams = new ArrayList<InputStream>();
		for (FileNode fileNode : fileNodes)
			inputStreams.add(new FileInputStream(fileNode.file));
		
		SequenceInputStream input = new SequenceInputStream(Collections.enumeration(inputStreams));		
		
		// Copy in->out.
		byte[] buf = new byte[1024];
		int len;
		try {
			while ((len=input.read(buf))!=-1) outStream.write(buf, 0, len);
		}
		finally {
			input.close();
			outStream.close();
		}
	}	

}
